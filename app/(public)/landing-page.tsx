"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCarousel } from "@/hooks/useCarousel";
import Login from "@/components/login";

const Landing = () => {
  const currentImage = useCarousel({ totalImages: 3 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row justify-between items-center mt-6 sm:mt-8 lg:mt-12 lg:h-[500px] rounded-lg gap-6 lg:gap-0"
      >
        <div className="hidden lg:block lg:w-1/2 lg:h-full relative overflow-hidden rounded-lg">
          {["/hero1.png", "/hero2.png", "/hero3.png"].map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Hero Banner ${index + 1}`}
              fill
              priority={index === currentImage}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              className={`object-cover transition-opacity duration-500 ${
                index === currentImage ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
        <div className="w-full lg:w-1/2 px-0 sm:px-4 lg:px-8 xl:px-16 mx-auto">
          <Login />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Landing;
