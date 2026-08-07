---
title: Domain Data Model
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# Domain Data Model

## Purpose

DJ Platform uses a relational knowledge-graph model. Entities are stored relationally while explicit relationships support discovery, editorial context, SEO and future recommendations.

## Knowledge layers

### Core data

Externally verifiable facts:

- names
- dates
- locations
- genres
- official links
- appearances
- tracks
- labels

### Editorial data

Human-reviewed interpretation:

- biographies
- style
- influence
- context
- curated selections
- editorial notes

### Intelligence data

Calculated or inferred information:

- similarity
- popularity
- completeness
- trend indicators
- duplicate probability
- AI confidence

Intelligence data must not be presented as verified fact.

## Core entities

### Dj

```text
id
slug
displayName
normalizedName
realName
shortBio
longBio
countryId
cityId
activeFrom
activeTo
activityStatus
editorialStatus
publishedAt
reviewedAt
createdAt
updatedAt
deletedAt
```

Relationships:

- aliases
- genres
- social profiles
- external profiles
- tracks
- sessions
- labels
- festivals
- rankings
- articles
- media
- sources
- similar DJs

### DjAlias

```text
id
djId
name
normalizedName
aliasType
isPrimary
```

### Genre

```text
id
slug
name
normalizedName
description
history
parentId
editorialStatus
```

Supports parent, child and related genres.

### DjGenre

```text
djId
genreId
role
weight
confidence
sourceId
editorialNotes
```

Roles:

```text
PRIMARY
SECONDARY
INFLUENCE
HISTORICAL
```

### Country

```text
id
isoCode
name
slug
```

### City

```text
id
countryId
name
slug
latitude
longitude
```

### Festival

```text
id
slug
name
description
countryId
cityId
officialUrl
foundedYear
activityStatus
editorialStatus
```

### FestivalEdition

```text
id
festivalId
name
year
startsAt
endsAt
status
officialUrl
```

### FestivalAppearance

```text
id
festivalEditionId
djId
stage
performanceDate
billingPosition
isHeadliner
sourceId
```

### Track

```text
id
slug
title
normalizedTitle
releaseDate
durationSeconds
isrc
editorialStatus
```

### TrackCredit

```text
trackId
djId
creditType
position
displayName
```

Credit types:

```text
PRIMARY_ARTIST
FEATURED_ARTIST
REMIXER
PRODUCER
COMPOSER
```

### Label

```text
id
slug
name
description
countryId
officialUrl
editorialStatus
```

### Session

External set, radio show or live recording reference.

```text
id
slug
title
djId
sessionType
platform
externalUrl
performedAt
publishedAt
durationSeconds
description
editorialStatus
```

The platform stores metadata and links, not copyrighted audio.

### Article

```text
id
slug
title
excerpt
body
articleType
authorId
editorialStatus
publishedAt
reviewedAt
```

### Ranking

```text
id
slug
title
description
rankingType
methodology
ownerType
editorialStatus
```

### RankingEdition

```text
id
rankingId
label
year
periodStart
periodEnd
publishedAt
```

### RankingEntry

```text
id
rankingEditionId
djId
position
previousPosition
score
editorialNote
```

Constraints:

- unique position per edition
- unique DJ per edition

### MediaAsset

```text
id
storageKey
mediaType
mimeType
width
height
fileSize
altText
credit
sourceUrl
license
status
```

### SocialProfile

```text
id
djId
platform
handle
url
verifiedAt
```

### ExternalProfile

```text
id
djId
provider
externalId
url
metadata
verifiedAt
```

### Source

```text
id
url
title
publisher
sourceType
accessedAt
verificationStatus
notes
```

### User

```text
id
name
email
image
status
createdAt
updatedAt
```

### Role

```text
READER
EDITOR
ADMIN
SUPER_ADMIN
```

### Favorite

```text
userId
djId
createdAt
```

The pair `userId + djId` is unique.

### AuditEvent

```text
id
actorUserId
action
entityType
entityId
beforeData
afterData
ipHash
createdAt
```

### ImportJob

Tracks file, status, counts, errors and created records.

### AiGeneration

```text
id
provider
model
promptVersion
taskType
inputHash
output
validationStatus
reviewedBy
reviewedAt
tokenUsage
estimatedCost
createdAt
```

## Similarity model

```text
DjSimilarity
├── sourceDjId
├── targetDjId
├── similarityType
├── score
├── explanation
├── generatedBy
├── reviewedAt
└── status
```

Rules:

- no self-relations
- symmetric relations use normalized direction
- AI-generated suggestions remain unpublished until reviewed

## MVP boundary

Required:

- Dj
- DjAlias
- Genre
- DjGenre
- Country
- City
- Festival
- FestivalEdition
- FestivalAppearance
- Ranking
- RankingEdition
- RankingEntry
- Session
- Article
- MediaAsset
- SocialProfile
- ExternalProfile
- Source
- User
- Role
- Favorite
- AuditEvent
- ImportJob

Optional after the first vertical slice:

- Track
- TrackCredit
- Label
- DjSimilarity
- AiGeneration

## Open decisions

Before Prisma implementation:

- internal ID format
- multilingual model timing
- article body format
- permissions persistence
- media ownership relations
- Track inclusion in MVP
- audit retention
