import { ToastExamples } from "@/components/social/ToastExamples";
import { ConfirmDialog } from "@/components/social/ConfirmDialog";
import { PostModal } from "@/components/social/PostModal";
import { AnimatedFeedItem } from "@/components/social/AnimatedFeedItem";
import { UserHoverCard } from "@/components/social/UserHoverCard";
import { MentionCombobox } from "@/components/social/MentionCombobox";
import { CommentsSheet } from "@/components/social/CommentsSheet";

export function UiDemo() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl flex flex-col gap-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Demonstração de Componentes</h1>
        <p className="text-muted-foreground">
          Coleção de componentes reutilizáveis integrados com shadcn/ui,
          Headless UI, Motion e Magic UI.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold border-b pb-2">Sonner (Toasts)</h2>
        <ToastExamples />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold border-b pb-2">Shadcn Dialogs</h2>
        <div className="flex gap-4 items-center">
          <ConfirmDialog
            triggerText="Excluir Post"
            title="Tem certeza absoluta?"
            description="Esta ação não pode ser desfeita. Isso excluirá permanentemente seu post."
            onConfirm={() => console.log("Confirmado!")}
          />
          <PostModal />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          Headless UI (Combobox)
        </h2>
        <MentionCombobox />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          HoverCard & Sheet
        </h2>
        <div className="flex items-center gap-6">
          <span>
            Passe o mouse no perfil: <UserHoverCard username="alexandre" />
          </span>
          <CommentsSheet />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          Motion & Magic UI Confetti (Feed Item)
        </h2>
        <div className="max-w-xl">
          <AnimatedFeedItem
            author="beatriz"
            title="Acabei de lançar meu novo projeto! 🚀"
            content="Integrei o shadcn/ui com motion e os resultados são incríveis. Curtam o post!"
          />
        </div>
      </section>
    </div>
  );
}
