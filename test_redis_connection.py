#!/usr/bin/env python3
"""
Test Redis connection to Railway Redis instance
"""
import redis
import sys
import os

# Railway Redis base hostname
redis_url = "rediss://red-d1es52fdiees73crkc6g:3ie0gE6r6y3W9lpBOPrHMs329Z4lGkcN@oregon-keyvalue.render.com:6379"

print("=" * 70)
print("Testing Railway Redis Connection")
print("=" * 70)
# print(f"Target hostname: {base_hostname}")
print()

# Check if full URL is provided as environment variable or argument
# redis_url = None

# if len(sys.argv) > 1:
#     redis_url = sys.argv[1]
#     # Mask password for display
#     if "@" in redis_url:
#         display_url = redis_url.split("@")[0].split("://")[0] + "://***@" + redis_url.split("@")[1]
#         print(f"✅ Using provided URL: {display_url}")
#     else:
#         print(f"⚠️  URL doesn't appear to have authentication: {redis_url}")
#         print(f"   Railway Redis requires: redis://default:PASSWORD@{base_hostname}:PORT")
# elif os.getenv("REDIS_URL"):
#     redis_url = os.getenv("REDIS_URL")
#     # Mask password for display
#     if "@" in redis_url:
#         display_url = redis_url.split("@")[0].split("://")[0] + "://***@" + redis_url.split("@")[1]
#         print(f"✅ Using REDIS_URL from environment: {display_url}")
#     else:
#         print(f"⚠️  REDIS_URL doesn't appear to have authentication")
#         print(f"   Current REDIS_URL: {redis_url}")
#         print(f"   Should be: redis://default:PASSWORD@{base_hostname}:PORT")
# else:
#     print("❌ No Redis URL provided!")
#     print()
#     print("Please provide the full Railway Redis URL in one of these ways:")
#     print()
#     print("1. As command line argument:")
#     print(f"   python3 test_redis_connection.py 'redis://default:PASSWORD@{base_hostname}:PORT'")
#     print()
#     print("2. As environment variable:")
#     print(f"   export REDIS_URL='redis://default:PASSWORD@{base_hostname}:PORT'")
#     print("   python3 test_redis_connection.py")
#     print()
#     print("3. Add to .env file:")
#     print(f"   REDIS_URL=redis://default:PASSWORD@{base_hostname}:PORT")
#     print()
#     print("To get the full URL from Railway:")
#     print("  Railway Dashboard -> Your Redis Service -> Connect -> REDIS_URL")
#     print()
#     sys.exit(1)

# if not redis_url:
#     sys.exit(1)

try:
    print(f"\nConnecting to Redis server...")
    client = redis.from_url(
        redis_url, 
        decode_responses=True, 
        socket_connect_timeout=10,
        socket_keepalive=True
    )
    
    # Test connection
    result = client.ping()
    print(f"✅ SUCCESS: Redis server is reachable!")
    print(f"   Ping result: {result}")
    
    # Get server info
    try:
        info = client.info('server')
        print(f"   Redis version: {info.get('redis_version', 'unknown')}")
    except:
        pass
    
    # Test basic operations
    try:
        test_key = "test_connection_key"
        client.set(test_key, "test_value", ex=60)  # Expires in 60 seconds
        value = client.get(test_key)
        client.delete(test_key)
        print(f"   ✅ Read/Write test: SUCCESS (set, get, delete worked)")
    except Exception as e:
        print(f"   ⚠️  Read/Write test failed: {e}")
    
    print("\n" + "=" * 70)
    print("✅ Redis connection is working correctly!")
    print("=" * 70)
    print(f"\nUse this URL in your .env file:")
    print(f"REDIS_URL={redis_url}")
    
except redis.AuthenticationError as e:
    print(f"❌ AUTHENTICATION ERROR: {e}")
    print("\nThis Redis server requires authentication.")
    print("Your URL should include a password, like:")
    print("  redis://default:PASSWORD@red-d1es52fdiees73crkc6g.railway.app:PORT")
    print("\nOr if using Railway, get the full URL from:")
    print("  Railway Dashboard -> Your Redis Service -> Connect -> REDIS_URL")
    sys.exit(1)
    
except redis.ConnectionError as e:
    print(f"❌ CONNECTION ERROR: {e}")
    print("\nPossible issues:")
    print("  1. Redis instance might be paused (check Railway dashboard)")
    print("  2. Port might be incorrect (Railway uses custom ports)")
    print("  3. Network firewall blocking the connection")
    print("  4. Missing password in URL")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

