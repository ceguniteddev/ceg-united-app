import dynamic from "next/dynamic";
import React, { useEffect } from "react";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

const AnalysisView = () => {
  const [content, setContent] = React.useState<string>("hello");

  useEffect(() => {
    console.log(content);
  }, [content]);

  return (
    <div>
      <Editor content={content} setContent={setContent} />
    </div>
  );
};

export default AnalysisView;
