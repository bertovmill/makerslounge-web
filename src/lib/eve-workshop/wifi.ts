// Single source of truth for the venue Wi-Fi, shown big on the hero slide and
// on the /wifi page.
//
// The password is deliberately NOT committed. It is a shared venue credential
// that briefly leaked publicly when this app took over eve.makerslounge.ca, so
// it now comes from the environment and defaults to nothing.
//
// Both consumers are server components, so this is read on the server and
// rendered into an auth-gated payload — do not switch it to a `NEXT_PUBLIC_`
// variable, which would be inlined into a client chunk that anyone can fetch
// without signing in.
export const wifi = {
  network: "TMU",
  username: "guest.wifi",
  password: process.env.WORKSHOP_WIFI_PASSWORD ?? "",
};

/** Shown wherever the password would go when none is configured. */
export const WIFI_PASSWORD_FALLBACK = "Ask a host";
