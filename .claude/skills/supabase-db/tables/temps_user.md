# Table `temps_user`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Table temporaire d'import des licences FFME (migration initiale).

```sql
CREATE TABLE public.temps_user (
  Numero_Licence_Origine bigint NOT NULL,
  Nom_Final text,
  Prenom_Final text,
  Date_Naissance_Final date,
  Sexe_Final text,
  Adresse_Final text,
  CodePostal_Final bigint,
  Ville_Final text,
  Telephone_Final text,
  Portable_Final text,
  Email_Final text,
  TypeLicence_Final text,
  Passeport_Final text,
  Observation_Final text,
  Groupe_Final text,
  CONSTRAINT temps_user_pkey PRIMARY KEY (Numero_Licence_Origine)
);
```
