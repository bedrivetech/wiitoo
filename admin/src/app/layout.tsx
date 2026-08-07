"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router/app";
import { dataProvider } from "./refine-providers/data-provider";
import { authProvider } from "./refine-providers/auth-provider";
import { ConfigProvider, App as AntApp } from "antd";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1677ff",
            },
          }}
        >
          <AntApp>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              routerProvider={routerProvider}
              resources={[
                {
                  name: "users",
                  list: "/resources/users",
                  create: "/resources/users/create",
                  edit: "/resources/users/:id",
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
                  meta: { label: "Chat Messages" },
                },
                {
                  name: "categories",
                  list: "/resources/categories",
                  create: "/resources/categories/create",
                  edit: "/resources/categories/:id",
                  meta: { label: "Categories" },
                },
                {
                  name: "reports",
                  list: "/resources/reports",
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
                  meta: { label: "Creator Verification" },
                },
              ]}
            >
              {children}
            </Refine>
          </AntApp>
        </ConfigProvider>
        </Suspense>
      </body>
    </html>
  );
}