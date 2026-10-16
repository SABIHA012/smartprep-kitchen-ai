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

- Prediction engines implement the `DemandModel` interface in src/lib/model.ts; swap the demo estimator there so every page picks up a trained model.
- Active dataset, model and safety buffer live in the client StoreProvider (src/lib/store.tsx); no backend, so uploads are session-only.
