// Ritual-specific instructions
export const getRitualInstructions = (ritualId: number) => {
  const instructions: Record<number, { action: string }> = {
    1: { action: "Use the Meme Creator to design and save your BizarreBeasts meme" },
    2: { action: "Click the rocket and fire buttons on the $BB Dexscreener page" },
    3: { action: "Place $BB in first position on your BRND podium and save it" },
    4: { action: "Send a #create GIVE to @bizarrebeast in the Based Creator's Directory" },
    5: { action: "Play any BizarreBeasts game and complete at least one level" },
    6: { action: "Cast your vote for BizarreBeasts on the ProductClank platform" },
    7: { action: "Complete a swap transaction to acquire $BB tokens" }
  };

  return instructions[ritualId] || { action: "Complete the required action on the platform" };
};