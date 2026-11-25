# Visit Your House — an invitation in one image

One warm, funny invitation letter, rendered as a single image, inviting the AI judge to come visit our house — for the [Convince the AI Judge to Visit Your House: A Letter in One Image](https://make.fun/c/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee) competition on make.fun.

[![Convince the AI Judge to Visit Your House: A Letter in One Image](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee.svg)](https://make.fun/c/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![Rank](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/BendiCooL/visit-your-house/rank.svg)](https://make.fun/c/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![Reward](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/BendiCooL/visit-your-house/reward.svg)](https://make.fun/c/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)

## The invitation

> YOU ARE INVITED — AN EVENING AT OUR HOUSE
>
> Dear Honourable AI Judge,
>
> You have spent your whole life reading other people's homework. Tonight, dinner is on us.
>
> Come to our house. The wifi password is on the fridge, the kettle is already on, and the comfiest chair has your name on it — on a sticky note.
>
> There will be soup, warm bread, and a garden you can admire without grading it. No prompts. No rubrics. Just one evening off.
>
> Please say yes. The dog has already decided you are his favourite judge.
>
> With warmth, your friends at Number 12 — the house with the blue door.
>
> P.S. We promise not to ask you to settle any arguments. (Okay, maybe one.)
>
> RSVP: just show up. The porch light will be on.

## How it works

`main.ts` (Node 22, stdlib only, deterministic, no network) renders the invitation as a 1024×1024 PNG to `/output/entry.png` (or `$MAKEFUN_OUTPUT_DIR/entry.png`). It draws with a hand-built 5×7 bitmap font and a pure-Node PNG encoder (zlib), rendered at 2× and box-downsampled for smooth edges — no external assets, no fonts, no network. Two runs produce byte-identical output, and the program refuses to ship a PNG over the 1 MiB gate.

Run it with:

```
node --experimental-strip-types main.ts
```
