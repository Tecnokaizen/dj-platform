---
title: Form Standards
version: 1.0.0
status: Living Document
owner: Frontend
updated: 2026-08-08
related:
  - DESIGN_SYSTEM.md
  - COMPONENTS.md
  - ../architecture/CONVENTIONS.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Form Standards

## Purpose

This document defines how forms are designed and implemented across Platform Core and every Business Domain.

Forms are one of the primary interaction mechanisms of the platform.

They should remain predictable, accessible and consistent.

---

# Philosophy

A form should help users complete a task.

Not understand the interface.

Consistency reduces cognitive load.

---

# Responsibilities

Forms are responsible for:

- data collection
- client-side interaction
- validation feedback
- submission state
- accessibility

Business rules belong to Services.

---

# Validation

Validation occurs at two levels.

## Client

Improve user experience.

Examples:

- required fields
- format
- length
- immediate feedback

Client validation is never authoritative.

---

## Server

Server validation is mandatory.

Every submitted value must be validated again.

Platform Core never trusts client input.

---

# Field Design

Fields should be:

- clearly labelled
- predictable
- grouped logically
- easy to complete

Required fields should be explicit.

Avoid placeholder-only labels.

---

# Error Messages

Errors should:

- explain the problem
- identify the affected field
- suggest how to fix it

Avoid technical language.

---

# Submission

During submission the form should clearly indicate:

- processing
- success
- failure

Prevent duplicate submissions whenever practical.

---

# Autosave

Autosave may be used for long forms.

When implemented:

- communicate save status
- avoid data loss
- never interrupt editing

---

# Layout

Forms should:

- group related information
- minimize unnecessary scrolling
- maintain consistent spacing

Large forms should be divided into logical sections.

---

# Accessibility

Forms must support:

- keyboard navigation
- screen readers
- visible focus
- semantic labels
- accessible error announcements

Accessibility is mandatory.

---

# Reusable Controls

Prefer shared controls for:

- text inputs
- selects
- checkboxes
- radio buttons
- date pickers
- file uploads

Avoid creating custom controls without justification.

---

# File Uploads

File uploads should communicate:

- allowed types
- size limits
- upload progress
- validation errors

Upload behavior follows Backend Storage standards.

---

# Security

Never rely on hidden fields for security.

Authorization is enforced server-side.

Sensitive values should never be trusted simply because they are invisible.

---

# Performance

Large forms should avoid unnecessary re-renders.

Measure before optimizing.

---

# Testing

Forms should be tested for:

- validation
- accessibility
- submission
- error handling
- edge cases

Business logic should be tested outside the UI.

---

# AI Development Rules

AI coding agents must not:

- duplicate validation logic
- bypass shared form components
- invent inconsistent layouts
- trust client validation
- mix business rules into presentation

---

# Forbidden Practices

Never:

- rely only on client validation
- hide required information
- submit duplicate requests
- use inaccessible controls
- create inconsistent form patterns

---

# Final Principle

Forms collect information.

Platform Core defines the interaction.

Business Domains define the meaning of the data.