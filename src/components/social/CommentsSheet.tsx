import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/Button";

export function CommentsSheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Ver Comentários
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Comentários</SheetTitle>
          <SheetDescription>
            Veja o que as pessoas estão falando sobre este post.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Lucas</p>
              <p className="text-sm text-muted-foreground">
                Muito bom, parabéns!
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Mariana</p>
              <p className="text-sm text-muted-foreground">
                Que design incrível! 😍
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
