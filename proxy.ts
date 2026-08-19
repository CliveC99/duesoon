export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/modules/:path*", "/deadlines/:path*", "/sign-in", "/sign-up"],
};
