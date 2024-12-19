"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, PlusCircle } from 'lucide-react';


export default function ChooseGame() {
  return (
    <div className={`min-h-screen bg-[#0A0A0A] overflow-hidden relative`}>
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(152,194,61,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(152,194,61,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />

      {/* Gradient Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(152, 194, 61, 0.15) 0%, rgba(10, 10, 10, 0) 50%)',
            'radial-gradient(circle at 80% 50%, rgba(152, 194, 61, 0.15) 0%, rgba(10, 10, 10, 0) 50%)',
            'radial-gradient(circle at 20% 50%, rgba(152, 194, 61, 0.15) 0%, rgba(10, 10, 10, 0) 50%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col items-center justify-center px-6">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-[15vh] text-white font-[var(--font-pixel)] mb-16 text-center"
        >
          Choose Your Path
        </motion.h1>

        {/* Cards Container */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
          {/* Join Game Card */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            className="flex-1"
          >
            <Link href="/joingames">
              <div className="relative group cursor-pointer">
                {/* Card Background with Gradient Border */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#98C23D]/20 to-[#98C23D]/0 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                
                <div className="relative bg-zinc-900/90 border border-[#98C23D]/20 rounded-2xl p-8 h-[300px]
                            backdrop-blur-xl group-hover:border-[#98C23D]/50 transition-all duration-500
                            flex flex-col items-center justify-center text-center">
                  {/* Icon */}
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="mb-6"
                  >
                    <Users className="w-16 h-16 text-[#98C23D]" />
                  </motion.div>

                  {/* Text Content */}
                  <h2 className="text-5xl text-white mb-4">Join Game</h2>
                  <p className="text-zinc-400 text-xl">Enter an existing game room and challenge other players</p>

                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-2xl transition-all duration-500
                              group-hover:shadow-[inset_0_0_20px_rgba(152,194,61,0.2)]" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Create Game Card */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            className="flex-1"
          >
            <Link href="/creategame">
              <div className="relative group cursor-pointer">
                {/* Card Background with Gradient Border */}
                <div className="absolute inset-0 bg-gradient-to-l from-[#98C23D]/20 to-[#98C23D]/0 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                
                <div className="relative bg-zinc-900/90 border border-[#98C23D]/20 rounded-2xl p-8 h-[300px]
                            backdrop-blur-xl group-hover:border-[#98C23D]/50 transition-all duration-500
                            flex flex-col items-center justify-center text-center">
                  {/* Icon */}
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="mb-6"
                  >
                    <PlusCircle className="w-16 h-16 text-[#98C23D]" />
                  </motion.div>

                  {/* Text Content */}
                  <h2 className="text-5xl text-white  mb-4">Create Game</h2>
                  <p className="text-zinc-400 text-xl">Start a new game room and invite others to join</p>

                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-2xl transition-all duration-500
                              group-hover:shadow-[inset_0_0_20px_rgba(152,194,61,0.2)]" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Floating Numbers Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-[#98C23D]/10 text-6xl font-bold"
              initial={{
                opacity: 0,
                x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
                y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0
              }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            >
              {Math.floor(Math.random() * 10)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}