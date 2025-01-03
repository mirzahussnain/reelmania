/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',  /* For Internet Explorer and Edge */
          'scrollbar-width': 'none',     /* For Firefox */
        },
        '.font-Mont':{
          fontFamily:'Montserrat sans-serif',
          fontOpticalSizing:'auto'
        },
       ' .font-Lato' : {
         'fontFamily': "Lato , serif;",
         'fontOpticalSizing':'auto',

       },
       'font-Liner':{
        'fontFamily': "Liner , serif;",
        'fontOpticalSizing':'auto',
       },
        '.scrollbar-custom::-webkit-scrollbar': {
          width: '8px',                /* Custom width for the scrollbar */
          height: '5px',   /* Custom height for the scrollbar */
          'background-color': 'transparent', /* Transparent background color */
        },
        '.scrollbar-custom::-webkit-scrollbar-thumb': {
          'background-color': '#8B0000',  /* Black color for the scrollbar thumb */
          'border-top-right-radius': '1px',   
          'border-bottom-right-radius':'3px'    /* Rounded corners for the scrollbar thumb */
        },
        '.scrollbar-custom::-webkit-scrollbar-track': {
          'background-color': 'transparent',  /* Transparent background color for the track */
          
        }
      
      });
    },
  ],
}