"use client";

type AppRouterLike = {
  replace: (href: string, options?: { scroll?: boolean }) => void;
  refresh: () => void;
};

/**
 * Atualiza a URL sem scrollar o documento e força o refetch do RSC.
 * `replace` sozinho, com scroll: false, às vezes não reaplica os dados na árvore atual.
 */
export function replaceAndRefresh(router: AppRouterLike, href: string) {
  router.replace(href, { scroll: false });
  router.refresh();
}
