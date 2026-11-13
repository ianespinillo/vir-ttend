---
title: "Versión 1.7.0 · Recuperar la contraseña y cambiarla desde la app"
date: 2026-11-08
version: 1.7.0
summary: "Quien olvida su contraseña puede recuperarla desde el login con un código que llega por correo, la contraseña temporal que genera un administrador se envía por email y la app móvil permite cambiar la contraseña."
tags: [seguridad, contraseñas, app móvil]
---

## Olvidé mi contraseña

- En el login de la **web** y de la **app móvil** hay un enlace **¿Olvidaste tu contraseña?**.
- Se ingresa el correo de la cuenta y llega un **código de 6 dígitos**, válido por **15 minutos**.
- Con el código se elige una contraseña nueva. El código sirve **una sola vez** y deja de valer tras varios intentos fallidos.
- Al restablecerla se **cierran todas las sesiones abiertas** de esa cuenta.
- Requiere que la instancia tenga el **envío de correos** configurado.

## Contraseña temporal por correo

- Cuando un **administrador** restablece la contraseña de un usuario, la contraseña temporal ahora también **se envía por email** al usuario.
- El administrador sigue viendo la contraseña en pantalla por si el correo no llega.

## Contraseñas en la app móvil

- Nueva pantalla **Cambiar contraseña** en **Configuración**.
- Después de un restablecimiento, la app **pide una contraseña nueva** en el primer ingreso.

## Correcciones

- Los **reportes** exigen una sesión iniciada y un rol con permiso.
- El diálogo de **materias** se puede desplazar cuando es más alto que la pantalla.
