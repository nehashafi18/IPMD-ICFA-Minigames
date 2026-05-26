SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Checking frontend..."
curl -f http://localhost:5173 > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "Frontend is DOWN"
  exit 1
fi

echo "Checking backend..."
curl -f http://localhost:5001/health > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "Backend is DOWN"
 exit 1
fi

echo "Checking SD backend..."
curl -f http://localhost:8000/health > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "SD backend is DOWN"
  exit 1
fi

echo "All services are healthy"