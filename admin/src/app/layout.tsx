"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router/app";
import { dataProvider } from "./refine-providers/data-provider";
import { authProvider } from "./refine-providers/auth-provider";
import { ConfigProvider, theme as antdTheme, App as AntApp } from "antd";
import { RefineKbarProvider } from "@refinedev/kbar";
import { Suspense } from "react";
import "./globals.css";
import { DarkModeProvider, useDarkMode } from "@/lib/use-dark-mode";
import { wiitooBrand, darkTokens, lightTokens } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Inner component that reads dark mode context to configure Ant Design theme. */
function ThemedApp({ children }: { children: React.ReactNode }) {
  const { isDark } = useDarkMode();
  const tokens = isDark ? darkTokens : lightTokens;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: wiitooBrand.primary,
          colorPrimaryHover: wiitooBrand.primaryHover,
          colorSuccess: wiitooBrand.success,
          colorError: wiitooBrand.danger,
          colorWarning: wiitooBrand.accent,
          colorInfo: wiitooBrand.secondary,
          borderRadius: 8,
          fontFamily: "var(--font-geist-sans), sans-serif",
          colorBgContainer: tokens.surface,
          colorBgLayout: tokens.bg,
          colorText: tokens.text,
          colorTextSecondary: tokens.textSecondary,
          colorBorder: tokens.border,
        },
        components: {
          Layout: {
            bodyBg: tokens.bg,
            headerBg: isDark ? tokens.surface : "#ffffff",
            siderBg: darkTokens.sidebar,
          },
          Menu: {
            darkItemBg: darkTokens.sidebar,
            darkItemColor: "#c4c4d0",
            darkItemSelectedBg: "rgba(124, 58, 237, 0.15)",
            darkItemSelectedColor: wiitooBrand.primary,
            itemBg: tokens.surface,
          },
          Card: {
            colorBgContainer: tokens.surface,
          },
          Table: {
            colorBgContainer: tokens.surface,
          },
          Modal: {
            contentBg: tokens.surface,
            headerBg: tokens.surface,
          },
        },
      }}
    >
      <AntApp>
        <RefineKbarProvider>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            routerProvider={routerProvider}
            resources={[
              {
                name: "users",
                list: "/resources/users",
                create: "/resources/users/create",
                show: "/resources/users/:id",
                edit: "/resources/users/:id/edit",
                meta: { label: "Users" },
              },
              {
                name: "videos",
                list: "/resources/videos",
                show: "/resources/videos/:id",
                edit: "/resources/videos/:id/edit",
                meta: { label: "Videos" },
              },
              {
                name: "streams",
                list: "/resources/streams",
                show: "/resources/streams/:id",
                meta: { label: "Streams" },
              },
              {
                name: "chat-messages",
                list: "/resources/chat-messages",
                show: "/resources/chat-messages/:id",
                meta: { label: "Chat Messages" },
              },
              {
                name: "categories",
                list: "/resources/categories",
                create: "/resources/categories/create",
                show: "/resources/categories/:id",
                edit: "/resources/categories/:id/edit",
                meta: { label: "Categories" },
              },
              {
                name: "reports",
                list: "/resources/reports",
                show: "/resources/reports/:id",
                meta: { label: "Reports" },
              },
              {
                name: "transactions",
                list: "/resources/transactions",
                show: "/resources/transactions/:id",
                meta: { label: "Transactions" },
              },
              {
                name: "payouts",
                list: "/resources/payouts",
                show: "/resources/payouts/:id",
                create: "/resources/payouts/create",
                meta: { label: "Payouts" },
              },
              {
                name: "email",
                meta: { label: "Email" },
              },
              {
                name: "email-providers",
                meta: { label: "Email Providers" },
              },
              {
                name: "email-templates",
                meta: { label: "Email Templates" },
              },
              {
                name: "email-log",
                meta: { label: "Email Log" },
              },
              {
                name: "subscriptions",
                list: "/resources/subscriptions",
                show: "/resources/subscriptions/:id",
                meta: { label: "Subscriptions" },
              },
              {
                name: "templates",
                list: "/resources/templates",
                create: "/resources/templates/create",
                edit: "/resources/templates/:id",
                meta: { label: "Templates" },
              },
              {
                name: "creator-verification",
                list: "/resources/creator-verification",
                show: "/resources/creator-verification/:id",
                meta: { label: "Creator Verification" },
              },
            ]}
          >
            {children}
          </Refine>
        </RefineKbarProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense>
          <DarkModeProvider>
            <ThemedApp>{children}</ThemedApp>
          </DarkModeProvider>
        </Suspense>
      </body>
    </html>
  );
}