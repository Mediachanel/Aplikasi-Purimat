package com.example.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = DarkPosterBluePrimary,
    onPrimary = Color(0xFF002255),
    primaryContainer = Color(0xFF003882),
    onPrimaryContainer = Color(0xFFE0EDFF),
    secondary = PosterYellowBadge,
    onSecondary = Color(0xFF451A03),
    secondaryContainer = Color(0xFF78350F),
    onSecondaryContainer = Color(0xFFFEF3C7),
    tertiary = PosterTerracottaWall,
    onTertiary = Color.White,
    background = DarkBackground,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = DarkTextSecondary,
    outline = Color(0xFF2E4068),
    error = Color(0xFFF87171)
)

private val LightColorScheme = lightColorScheme(
    primary = PosterBluePrimary,
    onPrimary = Color.White,
    primaryContainer = PosterBlueContainer,
    onPrimaryContainer = OnPosterBlueContainer,
    secondary = PosterYellowBadge,
    onSecondary = Color(0xFF1C1917),
    secondaryContainer = PosterYellowContainer,
    onSecondaryContainer = OnPosterYellowContainer,
    tertiary = PosterTerracottaWall,
    onTertiary = Color.White,
    tertiaryContainer = PosterTerracottaContainer,
    onTertiaryContainer = Color(0xFF7C2D12),
    background = PosterBackground,
    onBackground = TextPrimary,
    surface = PosterSurface,
    onSurface = TextPrimary,
    surfaceVariant = PosterSurfaceVariant,
    onSurfaceVariant = TextSecondary,
    outline = PosterOutline,
    error = StatusDanger
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = Color.Transparent.toArgb()
                window.navigationBarColor = Color.Transparent.toArgb()
                val insetsController = WindowCompat.getInsetsController(window, view)
                insetsController.isAppearanceLightStatusBars = !darkTheme
                insetsController.isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
