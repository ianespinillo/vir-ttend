# Feature: Workshop commissions — taller attendance in contraturno (technical schools)

## Status
QUEUED (2026-10-13). In design discussion with the user; not started.

## Objective
Support the technical-school workshop (taller): each course is split into commissions that attend the workshop in the opposite shift, and a workshop preceptor takes attendance per commission, similar to daily attendance.

## What we know (from the user)
- Only technical schools have it. Courses there are numeric, e.g. 1°4°, and are split into commissions named 141 and 142.
- Commissions never mix divisions: both come from the same course.
- The split is alphabetical by last name (then first name), aiming at 50/50.
- One workshop preceptor per commission (user: "es por comisión, creo" — tentative, confirm).

## Current state (mapped)
- Daily attendance: one record per student/course/date (`subjectId = NULL`), taken by PRECEPTOR/ADMIN. Subject attendance: per subject/date, taken by the subject teacher.
- One preceptor per course (`courses.preceptorId`), one shift per course (`courses.shift`). No contraturno, no session type, no technical-school flag.

## Proposed design (draft, not agreed in full)
- D1: New entity `WorkshopCommission` under `Course`: code (e.g. 141), students, workshop preceptor. A course "has workshop" iff it has commissions — no school-type flag.
- D2: Workshop attendance per commission per day, mirroring daily attendance, taken by the commission's preceptor.
- D3: The split is SUGGESTED alphabetically when commissions are created, then PERSISTED. Never recomputed live (a mid-year arrival would shift the cut and move students with their absence history). New students go to the smaller commission; admin can move students; explicit "regenerate split" action.

## Open questions (ask one at a time)
- Q1: Confirm one preceptor per commission (vs one per course covering both).
- Q2: How a workshop absence counts toward the student's total (full absence, half absence, separate counter?) and whether it affects the daily thresholds/reports.
- Q3: Always exactly 2 commissions, or variable?
- Q4: Workshop days/schedule: needed in the system (e.g. to know which days to take attendance), or attendance any day?
- Q5: Workshop teachers/sections (carpintería, electricidad…): in scope or not?
- Q6: Mobile app support for taking workshop attendance: same release or later?

## Checklist
- (to be written once the open questions are resolved)
