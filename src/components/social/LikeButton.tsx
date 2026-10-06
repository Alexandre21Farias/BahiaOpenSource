import { useState } from "react";
import { motion } from "motion/react";
import { Heart } from "@phosphor-icons/react";
import { Icon } from "../ui/icon";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/Button";

export function LikeButton() {
  const [liked, setLiked] = useState(false);

  const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
    const isLiked = !liked;
    setLiked(isLiked);

    if (isLiked) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x, y },
        colors: ["#ef4444", "#f87171", "#fca5a5"],
        disableForReducedMotion: true,
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLike}
      className={
        liked
          ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          : "text-muted-foreground"
      }
      aria-label={liked ? "Descurtir" : "Curtir"}
    >
      <motion.div
        whileTap={{ scale: 0.8 }}
        animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Icon
          icon={Heart}
          weight={liked ? "fill" : "regular"}
          className={liked ? "fill-current" : ""}
        />
      </motion.div>
    </Button>
  );
}
