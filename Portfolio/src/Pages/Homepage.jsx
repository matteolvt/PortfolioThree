import React from "react";
import ThreeRoom from "../Components/ThreeScene/ThreeScene.jsx";

function Homepage() {
  return (
    <div
      className="home"
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
    >
      <ThreeRoom />
    </div>
  );
}

export default Homepage;
