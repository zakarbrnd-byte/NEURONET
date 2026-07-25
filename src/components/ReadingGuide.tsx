export function ReadingGuide() {
  return (
    <section className="card reading-guide" aria-labelledby="reading-guide-heading">
      <h2 id="reading-guide-heading" className="card-title">
        How to read this screen
      </h2>
      <ol className="reading-guide-list">
        <li>Tap a neuron to inspect it.</li>
        <li>Hold a neuron to stimulate it.</li>
        <li>A tick is one backend simulation step.</li>
        <li>A neuron fires when its membrane potential reaches threshold.</li>
        <li>Fired neurons send signals only through real backend connections.</li>
        <li>Refractory neurons temporarily cannot fire again.</li>
      </ol>
    </section>
  );
}
