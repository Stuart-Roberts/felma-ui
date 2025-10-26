import { useState, useEffect } from "react";
import { API, postJSON } from "./logic";

export default function LifecycleStages({ item, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState({});
  const [working, setWorking] = useState(false);

  const currentStage = Number(item.stage) || 1;

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

  const completedCount = currentStage === 1 ? 1 : currentStage - 1;

  // Pre-populate notes with saved values when item loads
  useEffect(() => {
    const initialNotes = {};
    if (item.stage_3_involve) initialNotes[3] = item.stage_3_involve;
    if (item.stage_4_choose) initialNotes[4] = item.stage_4_choose;
    if (item.stage_5_prepare) initialNotes[5] = item.stage_5_prepare;
    if (item.stage_6_act) initialNotes[6] = item.stage_6_act;
    if (item.stage_7_learn) initialNotes[7] = item.stage_7_learn;
    if (item.stage_8_recognise) initialNotes[8] = item.stage_8_recognise;
    if (item.stage_9_share_story) initialNotes[9] = item.stage_9_share_story;
    setNotes(initialNotes);
  }, [item.id]);

  async function saveStageNote(stageNum, fieldName) {
    const note = (notes[stageNum] || "").trim();
    if (!note || working) return;
    setWorking(true);
    try {
      const payload = {
        stage: stageNum,
        note: note
      };
      await postJSON(`${API}/items/${item.id}/stage`, payload);
      setNotes({ ...notes, [stageNum]: "" });
      await onUpdate();
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="lifecycle-section">
      <div className="lifecycle-header" onClick={() => setExpanded(!expanded)}>
        <span>Lifecycle Progress</span>
        <span className="stage-count">{completedCount}/9</span>
        <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div className="lifecycle-stages">
          {stages.map((s) => {
            const isComplete = currentStage > s.num;
            const isCurrent = currentStage === s.num;
            const savedNote = s.field ? item[s.field] : null;
            const activeNote = notes[s.num] || "";

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
                    <>
                      <div className="stage-prompt" style={{ fontSize: "0.9em", opacity: 0.7 }}>{s.prompt}</div>
                      {savedNote && (
                        <div className="stage-note" style={{ marginBottom: 8, fontStyle: "italic" }}>
                          Previous: {savedNote}
                        </div>
                      )}
                      <textarea
                        placeholder="Edit your note..."
                        value={notes[s.num] || ""}
                        onChange={(e) => setNotes({ ...notes, [s.num]: e.target.value })}
                        disabled={working}
                        rows={3}
                      />
                      <button
                        className="stage-save-btn"
                        disabled={!activeNote.trim() || working}
                        onClick={() => saveStageNote(s.num, s.field)}
                        style={{ marginTop: 8 }}
                      >
                        {working ? "Saving..." : "Update"}
                      </button>
                    </>
                  ) : isCurrent ? (
                    <>
                      <div className="stage-prompt">{s.prompt}</div>
                      <textarea
                        placeholder="Add your thoughts..."
                        value={notes[s.num] || ""}
                        onChange={(e) => setNotes({ ...notes, [s.num]: e.target.value })}
                        disabled={working}
                        rows={3}
                      />
                      <button
                        className="stage-save-btn"
                        disabled={!activeNote.trim() || working}
                        onClick={() => saveStageNote(s.num, s.field)}
                      >
                        {working ? "Saving..." : `Continue to ${stages[s.num]?.name || "Next"}`}
                      </button>
                    </>
                  ) : (
                    <div className="stage-prompt" style={{ opacity: 0.5 }}>
                      {s.prompt}
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
