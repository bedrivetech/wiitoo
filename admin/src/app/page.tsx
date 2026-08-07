"use client";

import { NavigateToResource } from "@refinedev/nextjs-router/app";

export default function Home() {
  return <NavigateToResource resource="users" />;
}