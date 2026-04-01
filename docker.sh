#!/usr/bin/env sh

set -eu

DIRNAME=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
APP_ENV=local
ACTION="${1:-}"
MODE="${2:-}"
ENV_SAMPLE_FILE='.env.sample'
ENV_FILE='.env'
COMPOSE_FILE='docker-compose.yml'
N8N_SERVICE_NAME='n8n'

if command -v tput >/dev/null 2>&1 && [ -t 1 ]; then
	RED=$(tput setaf 1)
	GREEN=$(tput setaf 2)
	YELLOW=$(tput setaf 3)
	RESET_COLOR=$(tput sgr0)
else
	RED=''
	GREEN=''
	YELLOW=''
	RESET_COLOR=''
fi

display() {
	echo ">> $*"
}

display_error() {
	echo ">>${RED} $*${RESET_COLOR}"
}

display_success() {
	echo ">>${GREEN} $*${RESET_COLOR}"
}

usage() {
	echo ""
	echo "################ ${YELLOW}AVAILABLE COMMANDS${RESET_COLOR} ################"
	echo ""
	echo "./docker.sh start [--prod]     Start docker compose and follow logs"
	echo "./docker.sh stop [--prod]      Stop docker compose"
	echo "./docker.sh restart [--prod]   Rebuild, restart, and follow logs"
	echo "./docker.sh update [--prod]    Pull base image metadata, rebuild, and follow logs"
	echo "./docker.sh ssh [--prod]       Open a shell in the n8n container"
	echo ""
	exit 1
}

detect_compose() {
	if docker compose version >/dev/null 2>&1; then
		DOCKER_COMPOSE='docker compose'
	elif command -v docker-compose >/dev/null 2>&1; then
		DOCKER_COMPOSE='docker-compose'
	else
		display_error "Erreur : ni 'docker compose' ni 'docker-compose' n'est installe."
		exit 1
	fi
}

compose() {
	if [ "$DOCKER_COMPOSE" = 'docker compose' ]; then
		docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
	else
		docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
	fi
}

check_env_vars() {
	if [ ! -f "$ENV_SAMPLE_FILE" ]; then
		display_error "Erreur : le fichier $ENV_SAMPLE_FILE n'existe pas."
		return 1
	fi

	if [ ! -f "$ENV_FILE" ]; then
		display_error "Erreur : le fichier $ENV_FILE n'existe pas."
		return 1
	fi

	missing_vars=0
	while IFS= read -r line; do
		case "$line" in
			''|'#'*)
				continue
				;;
		esac

		var_name=${line%%=*}
		if ! grep -q "^${var_name}=" "$ENV_FILE"; then
			display_error "Variable manquante dans $ENV_FILE : $var_name"
			missing_vars=$((missing_vars + 1))
		fi
	done < "$ENV_SAMPLE_FILE"

	if [ "$missing_vars" -eq 0 ]; then
		display_success "Toutes les variables de $ENV_SAMPLE_FILE sont presentes dans $ENV_FILE."
		return 0
	fi

	display_error "$missing_vars variable(s) manquante(s) dans $ENV_FILE."
	return 1
}

follow_logs() {
	echo '*******************************************************************'
	echo '*******************************************************************'
	echo '* Running Docker on http://localhost:5678 (Press CTRL+C to quit) *'
	echo '*******************************************************************'
	echo '*******************************************************************'
	compose logs --tail=0 --follow
}

open_shell() {
	container_id=$(compose ps -q "$N8N_SERVICE_NAME")
	if [ -z "$container_id" ]; then
		display_error "Le conteneur $N8N_SERVICE_NAME n'est pas demarre. Lance d'abord ./docker.sh start${MODE:+ $MODE}."
		exit 1
	fi

	docker exec \
		-e COLUMNS="$(tput cols 2>/dev/null || echo 120)" \
		-e LINES="$(tput lines 2>/dev/null || echo 40)" \
		-ti "$container_id" \
		sh -c "cd /data && /bin/sh"
}

cd "$DIRNAME"

if [ "$MODE" = '--prod' ]; then
	APP_ENV=prod
	ENV_SAMPLE_FILE='.env.prod.sample'
	ENV_FILE='.env.prod'
	COMPOSE_FILE='docker-compose.prod.yml'
	N8N_SERVICE_NAME='n8n-main'
elif [ -n "$MODE" ]; then
	display_error "Option invalide : $MODE"
	usage
fi

echo ""
echo "***************************************************************************************************************"
echo "***************************************************************************************************************"
echo "                                    ENVIRONMENT: [${GREEN}$APP_ENV${RESET_COLOR}]                              "
echo "***************************************************************************************************************"
echo "***************************************************************************************************************"
echo ""

detect_compose
display "=> Available command: ($DOCKER_COMPOSE)"
display "=> Compose file: $COMPOSE_FILE"
display "=> Env file: $ENV_FILE"

if [ -z "$ACTION" ]; then
	usage
fi

if ! check_env_vars; then
	display_error "Le script est arrete car des variables sont manquantes dans $ENV_FILE."
	exit 1
fi

display "Lancement du script principal..."

case "$ACTION" in
	start)
		compose up -d --build
		follow_logs
		;;
	stop)
		compose down
		;;
	restart)
		compose down
		compose up -d --build
		follow_logs
		;;
	update)
		display "Reconstruction de l'image n8n..."
		compose build --pull n8n
		compose up -d
		display_success "n8n a ete reconstruit avec la version epinglee."
		follow_logs
		;;
	ssh)
		open_shell
		;;
	*)
		display_error "Invalid action target: $ACTION"
		usage
		;;
esac
