export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/calendar/:path*", "/modules/:path*", "/semesters/:path*", "/deadlines/:path*", "/groups/:path*", "/profile/:path*", "/sign-in", "/sign-up"],
};
