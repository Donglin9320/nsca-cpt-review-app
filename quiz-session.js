(function (root) {
  function capture(state) {
    return { activeUnit: state.activeUnit, mode: state.mode,
      queueIds: state.queue.map(q => q.id), currentId: state.queue[state.index]?.id || null,
      answeredChoice: state.answeredChoice };
  }
  function restore(saved, questions, wrong) {
    if (!saved || !Array.isArray(saved.queueIds)) return null;
    const mode = ['sequential', 'random', 'curated', 'wrong'].includes(saved.mode) ? saved.mode : 'sequential';
    const activeUnit = saved.activeUnit === 'all' || questions.some(q => q.unit === saved.activeUnit) ? saved.activeUnit : 'all';
    const eligible = questions.filter(q => (activeUnit === 'all' || q.unit === activeUnit)
      && (mode !== 'curated' || q.type === 'curated') && (mode !== 'wrong' || wrong[q.id]));
    const byId = new Map(eligible.map(q => [q.id, q]));
    const queue = [];
    for (const id of saved.queueIds) {
      if (byId.has(id)) { queue.push(byId.get(id)); byId.delete(id); }
    }
    queue.push(...byId.values());
    const index = Math.max(0, queue.findIndex(q => q.id === saved.currentId));
    const answeredChoice = queue[index]?.id === saved.currentId && queue[index]?.choices?.[saved.answeredChoice]
      ? saved.answeredChoice : null;
    return { activeUnit, mode, queue, index, answeredChoice };
  }
  const api = { capture, restore };
  if (typeof module !== 'undefined') module.exports = api;
  else root.NSCAQuizSession = api;
})(typeof window === 'undefined' ? globalThis : window);
