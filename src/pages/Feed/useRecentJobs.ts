import { useEffect, useState } from "react";
import { fetchJobs, type Job } from "../../services/jobs";

/**
 * Vagas mais recentes para o feed. Retorna `null` enquanto carrega ou se a
 * busca falhar: o feed não deve exibir erro por causa de um bloco secundário.
 */
export function useRecentJobs(limit = 3) {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchJobs({ limit })
      .then((data) => active && setJobs(data))
      .catch(() => active && setJobs(null));
    return () => {
      active = false;
    };
  }, [limit]);

  return jobs;
}
