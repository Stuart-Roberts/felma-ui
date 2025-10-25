// src/LifecycleStages.jsx - DEBUG VERSION
import { useState } from "react";
import { API, postJSON } from "./logic";

export default function LifecycleStages({ item, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [working, setWorking] = useState(false);
  const [activeNote, setActiveNote] = useState("");

  const currentStage = Number(item.stage) || 1;

  // DEBUG: Log to console
  console.log("LifecycleStages - item.stage:", item.stage);
  console.log("LifecycleStages - currentStage:", currentStage);

  const stages = [
    { num: 1, name: "Capture", description: "Item captured", auto: true },
    { num: 2, name: "Clarify", description: "Rated with 4 factors", auto: true },
    { num: 3, name: "Involve", prompt: "Who might see this differently? (1-3 people)", field: "stage_3_involve" },
    { num: 4, name: "Choose", prompt: "What's your next step or small test?", field: "stage_4_choose" },
    { num: 5, name: "Prepare", prompt: "What help or resources do you need?", field: "stage_5_prepare" },
    { num: 6, name: "Act", prompt: "What did you do? How did it go?", field: "stage_6_act" },
    { num: 7, name: "Learn", prompt: "What did you learn? What might you do differently?", field: "stage_7_learn" },
    { num: 8, name: "Recognise", prompt: "Acknowledge the effort and outcome", field: "stage_8_recognise" },
    { num: 9, name: "Share Story", description: "Story summary (auto-generated)", auto: true },
  ];

  async function saveStageNote(stageNum) {
    if (!activeNote.trim() || working) return;

    setWorking(true);
    try {
      await postJSON(`${API}/items/${item.id}/stage`, {
        stage: stageNum,
        note: activeNote.trim(),
      });
      setActiveNote("");
      if (onUpdate) onUpdate();
    } catch (e) {
      alert(`Failed to save: ${e.message}`);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="lifecycle-section">
      <div className="lifecycle-header" onClick={() => setExpanded(!expanded)}>
        <span>Lifecycle Progress</span>
        <span className="stage-count">{currentStage}/9</span>
        <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div className="lifecycle-stages">
          {stages.map((s) => {
            const isComplete = currentStage > s.num;
            const isCurrent = currentStage === s.num;
            const savedNote = s.field ? item[s.field] : null;

            // DEBUG: Log for stage 3
            if (s.num === 3) {
              console.log("Stage 3 - currentStage:", currentStage);
              console.log("Stage 3 - s.num:", s.num);
              console.log("Stage 3 - isCurrent:", isCurrent);
              console.log("Stage 3 - isComplete:", isComplete);
              console.log("Stage 3 - s.auto:", s.auto);
            }

            return (
              <div
                key={s.num}
                className={`stage-item ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""}`}
              >
                <div className="stage-number">{s.num}</div>
                <div className="stage-content">
                  <div className="stage-name">{s.name}</div>

                  {s.auto ? (
                    <div className="stage-auto">{s.description}</div>
                  ) : isComplete ? (
                    <div className="stage-note">{savedNote || "✓ Completed"}</div>
                  ) : isCurrent ? (
                    <>
                      <div className="stage-prompt">{s.prompt}</div>
                      <textarea
                        placeholder="Add your thoughts..."
                        value={activeNote}
                        onChange={(e) => setActiveNote(e.target.value)}
                        disabled={working}
                        rows={3}
                      />
                      <button
                        className="stage-save-btn"
                        disabled={!activeNote.trim() || working}
                        onClick={() => saveStageNote(s.num)}
                      >
                        {working ? "Saving..." : `Continue to ${stages[s.num]?.name || "Next"}`}
                      </button>
                    </>
                  ) : (
                    <div className="stage-prompt" style={{ opacity: 0.5 }}>
                      {s.prompt || s.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
