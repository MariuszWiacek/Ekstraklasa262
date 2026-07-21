import React from "react";
import { FaMedal } from "react-icons/fa";

const historyData = [
  {
    title: "Ekstraklasa Jesień 2025",
    link: "https://ekstraklasa252.vercel.app/",
    podium: [
      { name: "Bartek", place: 1 },
      { name: "Patrycja", place: 2 },
      { name: "Kornas", place: 3 },
    ],
  },
  {
    title: "Ekstraklasa Wiosna 2025",
    link: "https://ekstraklasa25.vercel.app/",
    podium: [
      { name: "Alan", place: 1 },
      { name: "Marcin", place: 2 },
      { name: "Seba", place: 3 },
    ],
  },
  {
    title: "Ekstraklasa Jesień 2024",
    link: "https://ekstraklasa24.vercel.app/",
    podium: [
      { name: "Robert", place: 1 },
      { name: "Alan", place: 2 },
      { name: "Łukasz", place: 3 },
    ],
  },
  {
    title: "EURO 2024",
    link: "https://eurobet2024.vercel.app/",
    podium: [
      { name: "Piotr", place: 1 },
      { name: "Robert", place: 2 },
      { name: "Marek", place: 3 },
    ],
  },
];

const medalColors = {
  1: "#F6C90E", // gold
  2: "#C0C0C0", // silver
  3: "#CD7F32", // bronze
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(31,41,55,0.6), rgba(0,0,0,0.8))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "3rem 1rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  intro: {
    maxWidth: "800px",
    color: "#EEE",
    fontSize: "1.1rem",
    lineHeight: "1.8",
    marginBottom: "3rem",
    textAlign: "center",
    fontStyle: "italic",
  },
  medalistsWrapper: {
    maxWidth: "600px",
    marginBottom: "3rem",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: "1.5rem 2rem",
    borderRadius: "20px",
    color: "#FFE066",
    boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
  },
  medalistsTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#FFD43B",
    marginBottom: "1rem",
    textAlign: "center",
  },
  medalistsList: {
    listStyle: "none",
    paddingLeft: 0,
    margin: 0,
  },
  medalistItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.8rem",
    fontWeight: "600",
    fontSize: "1.4rem",
  },
  medalistRank: {
    width: "24px",
    textAlign: "right",
    marginRight: "1rem",
    fontWeight: "700",
    color: "#FFD43B",
  },
  medalIcons: {
    marginLeft: "auto",
    display: "flex",
    gap: "4px",
  },
  medalIcon: {
    width: "20px",
    height: "20px",
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.7))",
  },
  title: {
    fontSize: "3.5rem",
    fontWeight: "800",
    marginBottom: "2rem",
    color: "#FFD43B",
    textShadow: "0 2px 8px rgba(0,0,0,0.7)",
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "2rem 2.5rem",
    marginBottom: "3rem",
    maxWidth: "600px",
    width: "100%",
    color: "#FFE066",
    boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
  },
  header: {
    marginBottom: "0.5rem",
  },
  editionTitle: {
    fontSize: "2.25rem",
    fontWeight: "600",
    color: "#FFD43B",
  },
  link2: {
    display: "block",
    marginTop: "0.25rem",
    color: "#AAA",
    fontWeight: "500",
    fontStyle: "italic",
    fontSize: "1rem",
  },
  list: {
    listStyle: "none",
    paddingLeft: 0,
    margin: "1.5rem 0 0 0",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1.5rem",
    cursor: "default",
  },
  medal: {
    marginRight: "1.2rem",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))",
    width: "36px",
    height: "36px",
  },
  winnerName: {
    fontSize: "36px",
    fontWeight: "800",
    color: medalColors[1],
  },
  secondThirdName: {
    fontSize: "1.6rem",
    fontWeight: "700",
  },
};

const Historia = () => {
  // 1. Calculate medals tally per user
  const medalTally = {};
  historyData.forEach(({ podium }) => {
    podium.forEach(({ name, place }) => {
      if (!medalTally[name]) medalTally[name] = [0, 0, 0];
      if (place >= 1 && place <= 3) {
        medalTally[name][place - 1]++;
      }
    });
  });

  // 2. Sort medalists by total medals desc, gold desc, silver desc, bronze desc
  const sortedMedalists = Object.entries(medalTally)
    .filter(([_, medals]) => medals.reduce((a, b) => a + b, 0) > 0)
    .sort((a, b) => {
      const aTotal = a[1].reduce((sum, val) => sum + val, 0);
      const bTotal = b[1].reduce((sum, val) => sum + val, 0);
      if (bTotal !== aTotal) return bTotal - aTotal;
      if (b[1][0] !== a[1][0]) return b[1][0] - a[1][0];
      if (b[1][1] !== a[1][1]) return b[1][1] - a[1][1];
      return b[1][2] - a[1][2];
    });

  return (
    <div style={styles.page}>
      <div style={styles.intro}>
        <p>
          <strong>Nasza liga</strong> to grupa znajomych połączonych wspólną
          pasją do piłki nożnej i rywalizacji.
          <br />
          Początki były proste – typowaliśmy wyniki meczów na kartce papieru,
          dla zabawy i emocji a organizatorem był mistrz statystyki - Bartek.
          <br />
          Z czasem nasza liga zaczęła się rozwijać, a przybywało chętnych do
          wspólnego typowania.
        </p>
        <p>
          Aby ułatwić prowadzenie wyników, przenieśliśmy się do internetu.
          Dzięki temu wszystko stało się przejrzyste, a zabawa – jeszcze
          lepsza. Dziś każda edycja to nowa dawka sportowych emocji, zdrowej
          rywalizacji i dobrej zabawy. A najlepsi z najlepszych trafiają do
          naszej <strong>Galerii Mistrzów</strong>, gdzie zapisują się na długo
          w historii futbolu.
        </p>
        <hr />
      </div>

      {/* Medalists ranked list */}
      <section style={styles.medalistsWrapper}>
        <h2 style={styles.medalistsTitle}>🏅 Medaliści</h2><hr />
        <ul style={styles.medalistsList}>
          {sortedMedalists.map(([name, medals], i) => (
            <li key={name} style={styles.medalistItem}>
              <span style={styles.medalistRank}>{i + 1}.</span>
              <span>{name}</span>
              <span style={styles.medalIcons}>
                {[0, 1, 2].map((idx) =>
                  [...Array(medals[idx])].map((_, medalIndex) => (
                    <FaMedal
                      key={`${idx}-${medalIndex}`}
                      style={{ ...styles.medalIcon, color: medalColors[idx + 1] }}
                      title={
                        idx === 0
                          ? "Złoty medal"
                          : idx === 1
                          ? "Srebrny medal"
                          : "Brązowy medal"
                      }
                    />
                  ))
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
<hr />
      <h1 style={styles.title}>🏆 Galeria Mistrzów</h1><hr />

      {historyData.map((edycja, index) => (
        <section key={index} style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.editionTitle}>{edycja.title}</h2>
            <a
              href={edycja.link}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link2}
            >
              {edycja.link}
            </a>
          </div>

          <ul style={styles.list}>
            {edycja.podium.map(({ name, place }) => {
              const color = medalColors[place] || "#FFE066";
              let nameStyle = {};

              if (place === 1) {
                nameStyle = { ...styles.winnerName, color };
              } else if (place === 2) {
                nameStyle = { ...styles.secondThirdName, color: medalColors[2] };
              } else if (place === 3) {
                nameStyle = { ...styles.secondThirdName, color: medalColors[3] };
              } else {
                nameStyle = { color };
              }

              return (
                <li key={place} style={styles.listItem}>
                  <FaMedal style={{ ...styles.medal, color }} />
                  <span style={nameStyle}>
                    {place}. {name}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default Historia;
