import React from 'react';

const Rules = () => {
  return (
    <div className="fade-in" style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '20px' }}>
      <h2>Regulamin:<hr /></h2>
      <ol>
        <li>
          <strong style={{ color: 'red' }}>Zakłady:</strong>
          <ul>
            <li>Każdy uczestnik powinien <b>wybrać swojego uzytkownika</b> i obstawić wynik oraz typ dla każdego meczu w danej kolejce.</li>
            <li>Zakłady można składać do rozpoczęcia meczu. Po rozpoczęciu meczu zakłady na ten mecz są zablokowane.</li>
            <li>Zakłady na kolejną kolejkę będą odblokowane po zakończeniu aktualnej kolejki przez daną grupę.</li>
          </ul>
        </li>
        <li>
          <strong style={{ color: 'red' }}>Zatwierdzanie Zakładów:</strong>
          <ul>
            <li>Aby zakłady zostały uwzględnione, należy je zatwierdzić przed rozpoczęciem meczu.</li>
            <li>Zakłady można zatwierdzić tylko raz. Po zatwierdzeniu zakładów, nie można ich zmieniać.</li>
          </ul>
        </li>
        <li>
          <strong style={{ color: 'red' }}>Punktacja Meczu:</strong>
          <ul>
            <li>Za każdy poprawny wynik otrzymuje się 3 punkty.</li>
            <li>Za każdy prawidłowy typ (1, X, 2) otrzymuje się 1 punkt.</li>
            <li>Punktacja zostanie obliczona na podstawie poprawnych wyników i typów dla wszystkich meczów w danej kolejce.</li>
            <li>Oznaczenia w karcie : <br />
              -✅ - 3 pkt - prawidłowy wynik odgadnięty<br />
              -☑️ - 1 pkt - tylko typ odgadnięty
            </li>
          </ul>
        </li>
        <li>
          <strong style={{ color: 'red' }}>Rozstrzygnięcie:</strong>
          <ul>
            <li>W przypadku, gdy dwóch lub więcej uczestników uzyska tę samą liczbę punktów, rozstrzygające będą dodatkowe kryteria, takie jak:
              <ul>
                <li>Liczba poprawnych wyników,</li>
              </ul>
            </li>
            <li>W przypadku tej samej liczby punktów i liczby poprawnych wyników, nagroda za zajęte miejsca sumowana jest i dzielona równo między tych uczestników.</li>
            <li>Przykłady:
              <ul>
                <li>Jeśli dwie osoby zajmują pierwsze miejsce, suma nagród za pierwsze i drugie miejsce jest dzielona równo między te osoby.</li>
                <li>Jeśli trzy osoby zajmują pierwsze miejsce, suma nagród za pierwsze, drugie i trzecie miejsce jest dzielona równo między te osoby.</li>
                <li>Jeśli dwie osoby zajmują drugie miejsce, suma nagród za drugie i trzecie miejsce jest dzielona równo między te osoby.</li>
                <li>Jeśli trzy osoby zajmują drugie miejsce, suma nagród za drugie i trzecie miejsce jest dzielona równo między te osoby.</li>
                <li>Jeśli cztery osoby zajmują trzecie miejsce, nagroda za trzecie miejsce jest dzielona równo między te osoby.</li>
                <li>Jeśli dwie osoby zajmują pierwsze miejsce, a trzy osoby zajmują drugie miejsce, suma nagród za pierwsze i drugie miejsce jest dzielona równo między dwie osoby na pierwszym miejscu, a suma nagród za trzecie miejsce jest dzielona równo między trzy osoby na drugim miejscu.</li>
              </ul>
            </li>
            <li>W przypadku, gdy pula nagród jest ograniczona, a liczba uczestników zajmujących ex aequo miejsca powoduje, że suma nagród jest niższa niż przydzielona na te miejsca, nagrody są dzielone proporcjonalnie.</li>
            <li>Uczestnicy zajmujący kolejne miejsca nie otrzymują nagród przeznaczonych dla miejsc, które zostały rozdysponowane ex aequo.</li>
          </ul>
        </li>
        <li>
          <strong style={{ color: 'red' }}>Inne Warunki:</strong>
          <ul>
            <li>Uczestnicy, którzy naruszają regulamin lub podejmują próby oszustwa, zostaną zdyskwalifikowani.</li>
            <hr />
          </ul>
        </li>
        <li>
          <strong style={{ color: 'red' }}>Bonusowa Kolejka:</strong>
          <ul>
            <li>Zwycięzca każdej kolejki otrzymuje ustaloną nagrodę bonusową.</li>
            <li>W przypadku remisu (więcej niż jeden zwycięzca), nagroda przechodzi na kolejną kolejkę i sumuje się aż do momentu wyłonienia jednego zwycięzcy.</li>
            <li>Jeśli w ostatniej kolejce nadal będzie remis, cała pula bonusowa zostaje przyznana zwycięzcy całej ligi.</li>
          </ul>
        </li>
      </ol>
    </div>
  );
};

export default Rules;