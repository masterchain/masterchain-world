#!/bin/sh

MASTERCOIN_TOOLS_DIR=/home/dev/mastercoin-tools/
LOCK_FILE=/tmp/msc_cron.lock
PARSE_LOG=parsed.log
VALIDATE_LOG=validated.log
ARCHIVE_LOG=archived.log

export PATH=$PATH:/usr/local/bin/
cd $MASTERCOIN_TOOLS_DIR

# check lock (not to run multiple times)
[ -f $LOCK_FILE ] && exit 0

# lock
touch $LOCK_FILE

# parse until full success
x=1 # assume failure
echo -n > $PARSE_LOG
while [ "$x" != "0" ];
do
  python msc_parse.py 2>&1 >> $PARSE_LOG
  x=$?
done

mkdir -p www/mastercoin_verify/addresses/
mkdir -p www/mastercoin_verify/transactions/
python msc_validate.py 2>&1 > $VALIDATE_LOG

# update archive
mkdir -p www/downloads/
python msc_archive.py 2>&1 > $ARCHIVE_LOG

# unlock
rm -f $LOCK_FILE
