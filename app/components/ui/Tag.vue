<script setup lang="ts">
interface Props {
	label?: string
	color?: string  // Accepte hex, rgb, ou nom Tailwind
	bgColor?: string  // Override complet du background
	textColor?: string  // Override complet du texte
	variant?: 'solid' | 'outline' | 'soft' | 'subtle'
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	icon?: string
	leadingIcon?: string
	trailingIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'solid',
	size: 'md',
	color: '#7FD857'  // Votre vert par défaut
})

// Calcul des styles inline selon la variante
const computedStyles = computed(() => {
	const bg = props.bgColor || props.color
	const text = props.textColor || getContrastColor(props.color)

	switch (props.variant) {
		case 'solid':
			return {
				backgroundColor: bg,
				color: text
			}
		case 'outline':
			return {
				backgroundColor: 'transparent',
				color: bg,
				borderColor: bg,
				borderWidth: '1px',
				borderStyle: 'solid'
			}
		case 'soft':
			return {
				backgroundColor: `${bg}15`,  // 15 = ~10% opacité en hex
				color: bg
			}
		case 'subtle':
			return {
				backgroundColor: `${bg}15`,
				color: bg,
				borderColor: `${bg}40`,
				borderWidth: '1px',
				borderStyle: 'solid'
			}
		default:
			return { backgroundColor: bg, color: text }
	}
})

// Classes Tailwind selon la taille (même que UBadge)
const sizeClasses = computed(() => {
	const sizes = {
		xs: 'text-[8px] leading-3 px-1 py-0.5 gap-1 rounded-sm',
		sm: 'text-[10px] leading-3 px-1.5 py-1 gap-1 rounded-sm',
		md: 'text-xs px-2 py-1 gap-1 rounded-md',
		lg: 'text-sm px-2 py-1 gap-1.5 rounded-md',
		xl: 'text-base px-2.5 py-1 gap-1.5 rounded-md'
	}
	return sizes[props.size]
})

const iconSizeClasses = computed(() => {
	const sizes = {
		xs: 'size-3',
		sm: 'size-3',
		md: 'size-4',
		lg: 'size-5',
		xl: 'size-6'
	}
	return sizes[props.size]
})

// Fonction pour déterminer si le texte doit être clair ou foncé
function getContrastColor(hexColor: string): string {
	if (!hexColor) return '#000000'

	// Retirer le # si présent
	const hex = hexColor.replace('#', '')

	// Convertir en RGB
	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)

	// Calculer la luminosité (formule W3C)
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

	// Retourner blanc ou noir selon la luminosité
	return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
</script>

<template>
  <span
			:style="computedStyles"
			:class="[
      'font-medium inline-flex items-center',
      sizeClasses
    ]"
	>
    <UIcon
				v-if="leadingIcon || icon"
				:name="leadingIcon || icon"
				:class="['shrink-0', iconSizeClasses]"
		/>

    <span class="truncate">
      <slot>{{ label }}</slot>
    </span>

    <UIcon
				v-if="trailingIcon"
				:name="trailingIcon"
				:class="['shrink-0', iconSizeClasses]"
		/>
  </span>
</template>
