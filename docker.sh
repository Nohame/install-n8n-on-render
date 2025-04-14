#!/usr/bin/env sh

DIRNAME="$(dirname "$0")"

# COLORS
# 0    black     BLACK     0,0,0
# 1    red       RED       1,0,0
# 2    green     GREEN     0,1,0
# 3    yellow    YELLOW    1,1,0
# 4    blue      BLUE      0,0,1
# 5    magenta   MAGENTA   1,0,1
# 6    cyan      CYAN      0,1,1
# 7    white     WHITE     1,1,1
RED=`tput setaf 1`
GREEN=`tput setaf 2`
YELLOW=`tput setaf 3`
BLUE=`tput setaf 4`
RESET_COLOR=`tput sgr0`


#        allow 91.188.79.50;    # OTHER APPS        => kafka
#        allow 91.188.79.34;    # BCZPEG-FRONT-01   => kafka
#        allow 91.188.79.35;    # BCZPEG-FRONT-02   => kafka
#        allow 91.188.79.41;    # BCZDED-FRONT-01   => kafka
#        allow 91.188.79.42;    # BCZDED-FRONT-02   => kafka
#        allow 139.59.171.225;  # PIM PREROD        => kafka
#        allow 143.110.169.169; # PIM PROD          => kafka
#        allow 109.205.66.101;  # BUREAUX           => kafka-ui


action=$1
APP_ENV=local
WORKDIR='/usr/src/myapp'

echo ""
echo "***************************************************************************************************************"
echo "***************************************************************************************************************"
echo "                                    ENVIRONMENT: [${GREEN}$APP_ENV${RESET_COLOR}]                              "
echo "***************************************************************************************************************"
echo "***************************************************************************************************************"
echo ""

# Affiche un message sur la sortie standard
display()
{
    echo ">> $@"
}

# Affiche un message d'erreur sur la sortie standard
display_error()
{
    echo ">>${RED} $@${RESET_COLOR}"
}

# Affiche un message de réussite sur la sortie standard
display_success()
{
    echo ">>${GREEN} $@${RESET_COLOR}"
}

# Détecter la commande 'docker compose' ou 'docker-compose'
if command -v docker compose > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Erreur : ni 'docker compose' ni 'docker-compose' n'est installé."
    exit 1
fi

echo ''
display "=> Available command: ($DOCKER_COMPOSE)"
echo ''

check_env_vars() {
    env_sample_file=".env.sample"
    env_file=".env"

    # Vérifie que les deux fichiers existent
    if [ ! -f "$env_sample_file" ]; then
        display_error "Erreur : le fichier $env_sample_file n'existe pas."
        return 1
    fi

    if [ ! -f "$env_file" ]; then
        display_error "Erreur : le fichier $env_file n'existe pas."
        return 1
    fi

    # Parcours des variables dans .env.sample
    missing_vars=0
    while IFS= read -r line; do
        # Ignore les lignes vides ou les commentaires
        if [ -z "$line" ] || [ "$(echo "$line" | cut -c1)" = "#" ]; then
            continue
        fi

        # Extrait le nom de la variable
        var_name=$(echo "$line" | cut -d'=' -f1)

        # Vérifie si la variable est présente dans .env
        if ! grep -q "^$var_name=" "$env_file"; then
            display_error "Variable manquante dans $env_file : $var_name"
            missing_vars=$((missing_vars + 1))
        fi
    done < "$env_sample_file"

    # Affiche un message final
    if [ $missing_vars -eq 0 ]; then
        display_success "Toutes les variables de $env_sample_file sont présentes dans $env_file."
        return 0
    else
        display_error "$missing_vars variable(s) manquante(s) dans $env_file."
        return 1
    fi
}

# Appel de la fonction et blocage du script en cas d'erreur
if ! check_env_vars; then
    display_error "Le script est arrêté car des variables sont manquantes dans .env."
    exit 1
fi

# Le reste du script continue ici si toutes les variables sont présentes
display "Lancement du script principal..."

checkAction()
{
  if [ -z $action ]; then
      echo 0
      exit
  else
      command_base="docker.sh"
      actionList=$(grep -E '# [a-zA-Z_-]+:.*?## .*$$' $command_base | cut -c3- | sort | awk -F/ 'BEGIN {FS = ":.*?## "}; {printf "  %s", $1}')
      eval "arr=($actionList)"

      for s in "${arr[@]}"; do
        if [ $action = "${s}" ]
        then
          echo 1
          exit
        fi
      done
      echo 0
      exit
  fi
}

# Affiche les commandes disponibles
usage()
{
    command_base="docker.sh"

    echo ""
    echo "################ ${YELLOW}AVAILABLE COMMANDS${RESET_COLOR} ################"
    echo ""
    # find comments formated like -> # <command>: ## <description>
	  grep -E '# [[:space:]$a-zA-Z_-]+:.*?## .*$$' $command_base | cut -c3- | sort | awk -F/ -v command_base=$command_base 'BEGIN {FS = ":.*?## "}; {printf command_base " \033[36m%-30s\033[0m %s\n", $1, $2}'
    echo ""
    exit
}

if [ $(checkAction) = 0 ]
then
  display_error "Invalid action target ..."
  usage
  exit 1
fi


# Check if .env file exists
if [ -e .env ]; then
    source .env
else
    echo "Please set up your .env file before starting your environment."
    exit 1
fi

# start: ## Start docker compose
if [ $action = 'start' ]
then
    #
    # Start up app
    #

    $DOCKER_COMPOSE up -d
    echo 'Display terminal log'
    echo '*******************************************************************'
    echo '*******************************************************************'
    echo "* Running Docker on http://localhost:5678(Press CTRL+C to quit) *"
    echo '*******************************************************************'
    echo '*******************************************************************'
    $DOCKER_COMPOSE logs --tail=0 --follow

# stop: ## Stop docker compose
elif [ $action = 'stop' ]
then
    #
    # Stop app
    #
    $DOCKER_COMPOSE down

# restart: ## Restart docker compose
elif [ $action = 'restart' ]
then
    #
    # restart app
    #
    $DOCKER_COMPOSE down
    $DOCKER_COMPOSE up -d
    echo 'Display terminal log'
    echo '*******************************************************************'
    echo '*******************************************************************'
    echo "* Running Docker on http://localhost:5678 (Press CTRL+C to quit) *"
    echo '*******************************************************************'
    echo '*******************************************************************'
    $DOCKER_COMPOSE logs --tail=0 --follow

# update: ## Met à jour n8n en supprimant l'image et redémarre le service
elif [ "$action" = 'update' ]; then
    display "Arrêt de l'application..."
    $DOCKER_COMPOSE down

    display "Suppression de l'image n8n..."
    docker image rm custom-n8n:latest || display_error "Image non trouvée ou déjà supprimée."

    display "Redémarrage de l'application avec la dernière image..."
    $DOCKER_COMPOSE up -d

    display_success "n8n est mis à jour avec la dernière version disponible."
    $DOCKER_COMPOSE logs --tail=0 --follow

# ssh: ## Connect ssh to app container
elif [ $action = 'ssh' ]
then
    docker exec -e COLUMNS="`tput cols`" -e LINES="`tput lines`" -ti install-n8n-on-render-n8n-1 sh -c "cd /data && /bin/sh"
fi
