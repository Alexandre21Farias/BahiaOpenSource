import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function ToastExamples() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button
        variant="outline"
        onClick={() => toast.success("Post publicado com sucesso!")}
      >
        Sucesso
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error("Falha ao publicar o post.")}
      >
        Erro
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.info("Nova atualização disponível.")}
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Mensagem deletada", {
            action: {
              label: "Desfazer",
              onClick: () => console.log("Desfeito"),
            },
          })
        }
      >
        Com Ação
      </Button>
    </div>
  );
}
