<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Original screens live in src/views and are mounted by thin route files; src/lib/nav.tsx adapts their old Link/useLocation calls to TanStack Router (keeps ported code unchanged).
- App routes use ssr:false because screens read browser storage (anonymous client id) on render.
