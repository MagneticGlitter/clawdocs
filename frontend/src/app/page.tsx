"use client";

import LeftRail from "@/components/layout/LeftRail";
import Toolbar from "@/components/toolbar/Toolbar";
import Workspace from "@/components/layout/Workspace";
import ChatPanel from "@/components/chat/ChatPanel";

export default function Home() {
  return (
    <div className="h-screen flex">
      <LeftRail />
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar />
        <Workspace />
      </div>
      <ChatPanel />
    </div>
  );
}
