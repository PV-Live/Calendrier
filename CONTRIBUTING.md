# Guide de contribution

Merci de votre intérêt pour contribuer à MyMedICal ! Ce document fournit des lignes directrices pour contribuer au projet.

## Comment contribuer

1. **Forker** le dépôt
2. **Cloner** votre fork localement
3. **Créer une branche** pour vos modifications
4. **Commiter** vos changements avec des messages clairs
5. **Pousser** vos modifications vers votre fork
6. Soumettre une **Pull Request**

## Standards de code

- Indenter avec 4 espaces
- Utiliser des commentaires pour expliquer le code complexe
- Suivre les conventions de nommage existantes
- Tester vos modifications avant de soumettre une PR

## Signaler des bugs

Si vous trouvez un bug, veuillez créer une issue en incluant :

- Une description claire du bug
- Les étapes pour reproduire le problème
- Le comportement attendu vs. observé
- Des captures d'écran si applicable
- Votre environnement (navigateur, OS, etc.)

## Proposer des fonctionnalités

Les propositions de nouvelles fonctionnalités sont les bienvenues ! Veuillez :

1. Créer une issue décrivant la fonctionnalité
2. Expliquer pourquoi cette fonctionnalité serait utile
3. Discuter de l'implémentation possible

## Structure du projet

```
/
├── css/                  # Styles CSS
├── js/                   # Scripts JavaScript
│   ├── calendar.js       # Logique du calendrier
│   ├── core.js           # Fonctions principales
│   ├── manual-entry.js   # Saisie manuelle
│   └── mistral-api.js    # Intégration API Vision
├── img/                  # Images et icônes
├── index.html            # Page principale
└── settings.html         # Page de paramètres
```

## Tests

Avant de soumettre une PR, testez vos modifications :

1. Vérifiez que l'application fonctionne correctement
2. Testez sur différents navigateurs si possible
3. Vérifiez que les fonctionnalités existantes ne sont pas cassées

## Licence

En contribuant, vous acceptez que vos contributions soient sous la même licence que le projet.

Merci pour votre contribution !
