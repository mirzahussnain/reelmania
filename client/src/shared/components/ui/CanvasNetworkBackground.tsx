import React, { useEffect, useRef } from "react";

export const CanvasNetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    // Calculate density based on screen size
    const particleCount = Math.floor((width * height) / 9000); 

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);

    let animationFrameId: number;

    // Pull the network colour from the semantic design token so styling stays
    // routed through index.css. Opacity is applied via ctx.globalAlpha rather
    // than baked into colour literals.
    const networkColor =
      getComputedStyle(canvas).getPropertyValue("--color-primary").trim() ||
      "currentColor";

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = networkColor;
        ctx.globalAlpha = 0.3;
        ctx.fill();

        // Connect particles to each other
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = networkColor;
            ctx.globalAlpha = 0.15 - (dist / 120) * 0.15;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        // Connect particles to the mouse
        const dxm = p.x - mouseX;
        const dym = p.y - mouseY;
        const distm = Math.sqrt(dxm * dxm + dym * dym);

        if (distm < 180) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = networkColor;
          ctx.globalAlpha = 0.4 - (distm / 180) * 0.4;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Subtle repel effect from mouse to make it feel tangible
          const force = (180 - distm) / 180;
          p.x += (dxm / distm) * force * 0.3;
          p.y += (dym / distm) * force * 0.3;
        }
      }

      // Draw a soft glowing aura around the mouse cursor itself
      if (mouseX !== -1000) {
        const mouseGlow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 200);
        mouseGlow.addColorStop(0, networkColor);
        mouseGlow.addColorStop(1, "transparent");
        ctx.fillStyle = mouseGlow;
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 200, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
};
