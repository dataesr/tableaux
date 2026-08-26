import { useQuery } from "@tanstack/react-query";

const { VITE_APP_SERVER_URL } = import.meta.env;

export function useDashboardVisibility(boardId: string): boolean {
  const { data } = useQuery({
    queryKey: ["list-dashboards"],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) =>
        response.json()
      ),
  });

  const board = data?.find((dashboard) => dashboard.id === boardId);
  return board ? board.homePageVisible !== false : true;
}
