import jsPDF from "jspdf";

export function downloadBlueprint(name, ideation) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(name, 10, 15);

  doc.setFontSize(12);
  doc.text("Description:", 10, 30);
  doc.text(ideation.description, 10, 37, { maxWidth: 180 });

  doc.text("Features:", 10, 55);
  ideation.features.forEach((f, i) => {
    doc.text(`• ${f}`, 12, 63 + i * 6);
  });

  doc.text("Tech Stack:", 10, 63 + ideation.features.length * 6 + 10);
  doc.text(JSON.stringify(ideation.techStack, null, 2), 12, 63 + ideation.features.length * 6 + 17);

  doc.save(`${name}-blueprint.pdf`);
}
