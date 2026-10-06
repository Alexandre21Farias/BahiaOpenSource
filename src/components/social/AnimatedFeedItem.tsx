import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "./LikeButton";

export function AnimatedFeedItem({
  title,
  content,
  author,
}: {
  title: string;
  content: string;
  author: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="p-4 border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`}
          />
          <AvatarFallback>
            {author.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold">{author}</h4>
          <p className="text-sm text-muted-foreground">Há 2 horas</p>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="mt-1">{content}</p>
      </div>
      <div className="flex items-center pt-2 border-t mt-2">
        <LikeButton />
      </div>
    </motion.div>
  );
}
