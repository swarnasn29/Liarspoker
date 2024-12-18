"use client";
import { useGlobalContext } from "./context/GlobalContext";
import { motion } from "framer-motion";
import Head from "next/head";
import Link from "next/link";

// Enhanced Floating Number with Framer Motion
const FloatingNumber = ({
  children,
  className,
}: {
  children: string;
  className: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: [0.1, 0.2, 0.1],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className={`absolute font-[var(--font-minecraft)] text-2xl sm:text-3xl md:text-4xl text-gray-800/10 ${className}`}
  >
    {children}
  </motion.div>
);

// First, let's create a new component for the pie chart
const AnimatedPieChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="hidden lg:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
    >
      <div className="relative w-[300px] h-[300px]">
        {/* Base Circle - Full circle in darker shade */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#98C23D20"
              strokeWidth="10"
              className="transform -rotate-90 origin-center"
            />
          </svg>
        </div>

        {/* Winning Segment - Overlaid on top */}
        <div className="absolute inset-0">
          <motion.svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            initial={{ rotate: -90 }}
          >
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#98C23D"
              strokeWidth="10"
              strokeDasharray="282.7433388230814"
              strokeDashoffset="70.68583470577034"
              initial={{ strokeDashoffset: 282.7433388230814 }}
              animate={{ strokeDashoffset: 70.68583470577034 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </motion.svg>
        </div>

        {/* Glowing effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              "0 0 20px rgba(152, 194, 61, 0.2)",
              "0 0 40px rgba(152, 194, 61, 0.4)",
              "0 0 20px rgba(152, 194, 61, 0.2)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Center Circle with Stats */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     w-[200px] h-[200px] rounded-full bg-[#0A0A0A] border-4 border-[#98C23D]/30
                     flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="relative"
            >
              <span className="text-[#98C23D] text-5xl font-bold">75%</span>
              <motion.span
                className="block text-zinc-400 text-sm mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Win Rate
              </motion.span>
            </motion.div>
          </div>
        </motion.div>

        {/* Animated Dots */}
        {[...Array(12)].map((_, i) => {
          // Pre-calculate and round the values to avoid hydration mismatches
          const top = `${
            Math.round((50 + 45 * Math.sin((i * 2 * Math.PI) / 12)) * 100) / 100
          }%`;
          const left = `${
            Math.round((50 + 45 * Math.cos((i * 2 * Math.PI) / 12)) * 100) / 100
          }%`;

          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#98C23D]"
              style={{ top, left }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          );
        })}
      </div>

      {/* Stats Labels */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute -right-48 top-1/2 transform -translate-y-1/2 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#98C23D] shadow-[0_0_10px_rgba(152,194,61,0.5)]" />
          <span className="text-zinc-300 text-2xl">Wins (75%)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#98C23D]/20" />
          <span className="text-zinc-400 text-3xl">Losses (25%)</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function LiarSpoker() {
  const { isWalletConnected, connectWallet, walletAddress } =
    useGlobalContext();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <>
      <div
        className={`min-h-screen bg-[#0A0A0A] overflow-hidden relative 
      px-6 sm:px-8 md:px-10 lg:px-12`}
      >
        {/* Adjusted Gradient Background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(152, 194, 61, 0.15) 0%, rgba(10, 10, 10, 0) 50%)",
              "radial-gradient(circle at 20% 50%, rgba(152, 194, 61, 0.2) 0%, rgba(10, 10, 10, 0) 70%)",
              "radial-gradient(circle at 20% 50%, rgba(152, 194, 61, 0.15) 0%, rgba(10, 10, 10, 0) 50%)",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main Content */}
        <motion.div
          className=" top-14 p-4 sm:p-6 md:p-8 relative flex  min-h-screen"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="relative z-10">
            {/* Animated Logo */}
            <motion.h1
              className="text-white text-3xl sm:text-7xl md:text-8xl lg:text-[35vh]  leading-none"
              variants={itemVariants}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              
            >
              Liar's Poker
            </motion.h1>

            {/* Rest of the content with adjusted margins */}
            <motion.p
              className="text-zinc-400 text-base sm:text-lg md:text-5xl mt-3 sm:mt-4 font-light tracking-wide"
              variants={itemVariants}
              style={{fontFamily: "jersey 10"}}
            >
              Master the Art of Deception
            </motion.p>

            <motion.div
              className="flex flex-row gap-6 mt-6 sm:mt-8"
              variants={itemVariants}
            >
              <motion.div className="text-zinc-500">
                <span className="block text-lg sm:text-3xl text-[#98C23D] font-bold">
                  2.5K+
                </span>
                <span className="text-sm sm:text-base">Active Players</span>
              </motion.div>
              <motion.div className="text-zinc-500">
                <span className="block text-lg sm:text-3xl text-[#98C23D] font-bold">
                  10K+
                </span>
                <span className="text-3xl sm:text-base ">Games Played</span>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-row gap-4 mt-6 sm:mt-8"
              variants={itemVariants}
            >
              <Link href="/choosegame">
                <motion.button
                  className="bg-[#98C23D] text-black text-5xl  px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium"
                  whileHover={{ scale: 1.05, backgroundColor: "#88b22d" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Now
                </motion.button>
              </Link>
              <motion.button
                className="border border-zinc-700 text-white text-5xl px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium"
                whileHover={{ scale: 1.05, borderColor: "#98C23D" }}
                whileTap={{ scale: 0.95 }}
              >
                Learn Rules
              </motion.button>
            </motion.div>
          </div>

          {/* Adjusted Pie Chart Position - Only visible on larger screens */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2">
            <AnimatedPieChart />
          </div>

          {/* Simplified decorative elements */}
          <motion.div
            className="absolute bottom-0 right-0 w-[20rem] sm:w-[25rem] h-[25rem] opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1.5 }}
          >
            <motion.div
              className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-[#98C23D]/20 via-zinc-800/20 to-transparent rounded-tl-full"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
