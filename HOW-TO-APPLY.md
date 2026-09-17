# Homepage update — how to apply

I don't have push access to your GitHub repo, so here are the exact files to
drop in. Only **two things changed**:

1. `src/App.jsx` — the `HomePage()` component was updated (adds product
   photos, the correct phone number, and full shop address/contact block).
   Everything else in the file is untouched.
2. `public/images/*.jpg` — 7 new photos, referenced by the new HomePage code.

## Apply it

```bash
# from your repo root
git checkout -b homepage-photos-contact

# copy the two things from this package into the same paths in your repo
cp path/to/pr-package/src/App.jsx src/App.jsx
cp path/to/pr-package/public/images/*.jpg public/images/

git add src/App.jsx public/images
git commit -m "Homepage: add product photos, shop address and correct phone number"
git push origin homepage-photos-contact
```

Then open GitHub → you'll see "Compare & pull request" for the
`homepage-photos-contact` branch → open the PR into `main`. Vercel will build
a preview deployment on the PR automatically if it's connected to the repo.

## What to check before merging

- Phone number shown as **+91 98990 29807** in the header, hero button,
  contact card and footer.
- Address: *Dayalpur, 33 Ft Road, near Akashdeep School, North East Delhi –
  110094*, with a **Open in Google Maps** button linking to the map you sent.
- Email: `sharmajikaoffice@gmail.com`
- 6 product photos in a new "What we make" section (self-inking, pre-inked
  flash, round/square seals, address & GST stamps, signature stamps, handle
  stamps).

Two of the photos you sent (`image-03.png`, `image-04.png`) had another
supplier's watermark on them; I cropped those out before including them here.
Worth swapping in your own shop photos over time since those originals are
catalogue images, not yours.
