# A smieci wyniosles? - MVP

## Glowny problem

W gospodarstwach domowych czesto dochodzi do konfliktow zwiazanych z podzialem obowiazkow. Domownicy maja rozne wyobrazenie o tym, kto wykonuje wiecej pracy, a brak danych powoduje poczucie niesprawiedliwosci i nieporozumienia.

## Najmniejszy zestaw funkcjonalnosci

- Rejestracja i logowanie uzytkownikow.
- Tworzenie gospodarstwa domowego.
- Dodawanie domownikow do gospodarstwa.
- Tworzenie obowiazkow domowych wraz z okresleniem ich wagi punktowej.
- Oznaczanie wykonania obowiazku przez konkretnego domownika.
- Dashboard pokazujacy wykonane obowiazki i aktualny Fairness Score dla kazdego domownika.
- Historia wykonanych obowiazkow.

## Co nie wchodzi w zakres MVP

- Integracja z kalendarzami.
- Powiadomienia push i e-mail.
- Automatyczne przypisywanie obowiazkow przez AI.
- Aplikacja mobilna.
- Gamifikacja (odznaki, poziomy, rankingi).
- Obsluga wielu gospodarstw przez jednego uzytkownika.
- Zaawansowane statystyki i wykresy historyczne.
- Integracje z asystentami glosowymi.

## Kryteria sukcesu

- Uzytkownik moze utworzyc gospodarstwo domowe i dodac co najmniej dwoch domownikow.
- Uzytkownik moze utworzyc obowiazek, przypisac mu wage punktowa i oznaczyc jego wykonanie.
- System poprawnie wylicza Fairness Score na podstawie wykonanych obowiazkow.
- Dashboard pokazuje aktualny udzial kazdego domownika w obowiazkach domowych.
- Test E2E potwierdza glowny przeplyw: utworzenie gospodarstwa -> dodanie obowiazku -> oznaczenie wykonania -> aktualizacja Fairness Score.
- Aplikacja jest wdrozona i posiada dzialajacy pipeline CI/CD.
