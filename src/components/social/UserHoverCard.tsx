import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserHoverCard({ username }: { username: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="font-semibold text-primary cursor-pointer hover:underline" />
        }
      >
        @{username}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="w-64 p-4 flex gap-4 bg-popover text-popover-foreground"
      >
        <Avatar>
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
          />
          <AvatarFallback>
            {username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h4 className="font-bold">{username}</h4>
          <p className="text-sm text-muted-foreground">
            Desenvolvedor Frontend Sênior.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
