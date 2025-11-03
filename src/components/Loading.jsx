import { motion } from "framer-motion";

const Loading = ({ message = "Memuat...", size = "md", type = "spinner" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const spinner = (
    <div className={`${sizeClasses[size]} border-4 border-slate-200 rounded-full`}>
      <div className={`${sizeClasses[size]} border-t-blue-500 border-r-blue-500 border-b-blue-500 border-l-transparent rounded-full animate-spin`}></div>
    </div>
  );

  const dots = (
    <div className="flex space-x-1">
      <motion.div 
        className="w-2 h-2 bg-blue-500 rounded-full" 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
      />
      <motion.div 
        className="w-2 h-2 bg-blue-500 rounded-full" 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
      />
      <motion.div 
        className="w-2 h-2 bg-blue-500 rounded-full" 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
      />
    </div>
  );

  const pulse = (
    <div className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-pulse`}></div>
  );

  const loader = type === "dots" ? dots : type === "pulse" ? pulse : spinner;

  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-6">
      {loader}
      {message && <p className="text-slate-600 dark:text-slate-400 text-sm">{message}</p>}
    </div>
  );
};

export default Loading;