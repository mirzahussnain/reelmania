export const dateFormatter = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime(); // Difference in milliseconds
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
  
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} months ago`;
    } else {
      return `${diffYears} years ago`;
    }
  };
export const formatNumber = (num: number) => {
    if (num >= 1000 && num < 1_000_000) {
        return (num / 1000).toFixed(1) + "K";
    } else if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + "M";
    }
    return num.toString();
};