import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const Error = ({ message, onRetry, retryText = "Coba Lagi" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-red-50/80 border border-red-200 rounded-2xl p-4 text-center backdrop-blur-sm"
    >
      <div className="flex flex-col items-center">
        <AlertCircle className="text-red-500 mb-2" size={24} />
        <p className="text-red-600 text-sm mb-3">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm"
          >
            {retryText}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Error;