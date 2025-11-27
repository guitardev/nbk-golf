import NextAuth from "next-auth"
import Line from "next-auth/providers/line"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Line({
            clientId: process.env.AUTH_LINE_ID,
            clientSecret: process.env.AUTH_LINE_SECRET,
            authorization: { params: { scope: "profile openid email" } },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // Check if user is admin
                const adminIds = (process.env.NEXT_PUBLIC_ADMIN_LINE_IDS || "").split(',').map(id => id.trim());
                const isAdmin = adminIds.includes(user.id || ""); // Line provider returns 'sub' as 'id'

                token.role = isAdmin ? "admin" : "user";
                token.id = user.id || "";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login', // We might want to create a custom login page later, or just redirect to line
    },
})
