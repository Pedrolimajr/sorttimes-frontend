import { useLocation } from 'react-router-dom';

export const usePageLayout = () => {
  const location = useLocation();
  const isFixedPage = ['/', '/login'].includes(location.pathname);
  
  return {
    containerClass: isFixedPage 
      ? 'h-screen overflow-hidden' 
      : 'min-h-screen overflow-y-auto',
    mainClass: isFixedPage 
      ? 'h-[calc(100vh-40px)]' 
      : 'flex-1'
  };
};